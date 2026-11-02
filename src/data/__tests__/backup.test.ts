/** @format */
/**
 * Unit tests for backup export/import/clipboard adapters with mocked Expo modules.
 */
jest.mock("expo-file-system", () => {
  const mockInstances: Array<{
    uri: string;
    write: jest.Mock;
    text: jest.Mock;
  }> = [];
  return {
    File: jest.fn(function (
      this: {
        uri: string;
        write: jest.Mock;
        text: jest.Mock;
      },
      path: unknown,
      name?: unknown
    ) {
      void path;
      void name;
      this.uri = "mock://uri";
      this.write = jest.fn();
      this.text = jest.fn().mockResolvedValue("mock-file-text");
      mockInstances.push(this);
    }),
    Paths: { cache: "mock-cache" },
    __MOCK_INSTANCES__: mockInstances,
  };
});
jest.mock("expo-sharing", () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
  getStringAsync: jest.fn(),
}));
import { Paths } from "expo-file-system";
import { shareAsync } from "expo-sharing";
import { getDocumentAsync } from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import { exportToFile, importFromFile, copyToClipboard } from "../backup";
const mockFileSystem = jest.requireMock("expo-file-system") as {
  File: jest.Mock;
  __MOCK_INSTANCES__: Array<{
    uri: string;
    write: jest.Mock;
    text: jest.Mock;
  }>;
};
const mockedShare = shareAsync as jest.Mock;
const mockedGetDocument = getDocumentAsync as jest.Mock;
const mockedSetString = Clipboard.setStringAsync as jest.Mock;
describe("data/backup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileSystem.__MOCK_INSTANCES__.length = 0;
  });
  it("exportToFile writes to cache file and shares it", async () => {
    await exportToFile('{"a":1}');
    expect(mockFileSystem.File).toHaveBeenCalledWith(
      "mock-cache",
      expect.stringContaining("qadaa-backup-")
    );
    const instance = mockFileSystem.__MOCK_INSTANCES__[0];
    expect(instance).toBeDefined();
    expect(instance?.write).toHaveBeenCalledWith('{"a":1}');
    expect(mockedShare).toHaveBeenCalledWith("mock://uri");
    void Paths;
  });
  it("exportToFile rejects oversized backups", async () => {
    await expect(exportToFile("x".repeat(250_001))).rejects.toThrow(
      "Backup is too large to export"
    );
  });

  it("importFromFile returns null on cancel", async () => {
    mockedGetDocument.mockResolvedValueOnce({ canceled: true, assets: null });
    await expect(importFromFile()).resolves.toBeNull();
  });
  it("importFromFile returns null when no asset", async () => {
    mockedGetDocument.mockResolvedValueOnce({ canceled: false, assets: [] });
    await expect(importFromFile()).resolves.toBeNull();
  });
  it("importFromFile returns file text on success", async () => {
    mockedGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "mock://doc" }],
    });
    await expect(importFromFile()).resolves.toBe("mock-file-text");
    expect(mockFileSystem.File).toHaveBeenLastCalledWith("mock://doc");
  });
  it("copyToClipboard writes the text", async () => {
    await copyToClipboard("data");
    expect(mockedSetString).toHaveBeenCalledWith("data");
  });

  it("copyToClipboard handles errors safely", async () => {
    const error = new Error("Clipboard error");
    mockedSetString.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Test that copyToClipboard resolves and doesn't throw the error
    await expect(copyToClipboard("data")).resolves.toBeUndefined();
    expect(mockedSetString).toHaveBeenCalledWith("data");
    expect(consoleSpy).toHaveBeenCalledWith("Failed to copy to clipboard", error);
    consoleSpy.mockRestore();
  });
});
