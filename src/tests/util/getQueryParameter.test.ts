import { getQueryParameter } from "@/util/getQueryParameter";

describe("getQueryParameter", () => {
  beforeEach(() => {
    // Mock window.location.search
    Object.defineProperty(global, "window", {
      value: {
        location: {
          search: "",
        },
      },
      writable: true,
    });
  });

  it("should return the value of the query parameter if it exists", () => {
    window.location.search = "?param1=value1&param2=value2";
    expect(getQueryParameter("param1")).toBe("value1");
    expect(getQueryParameter("param2")).toBe("value2");
  });

  it("should return null if the query parameter does not exist", () => {
    window.location.search = "?param1=value1&param2=value2";
    expect(getQueryParameter("param3")).toBeNull();
  });

  it("should return null if there are no query parameters", () => {
    window.location.search = "";
    expect(getQueryParameter("param1")).toBeNull();
  });

  it("should return null if window.location.search is undefined", () => {
    Object.defineProperty(window, "location", {
      value: {
        search: undefined,
      },
      writable: true,
    });
    expect(getQueryParameter("param1")).toBeNull();
  });

  it("should return the first value if there are duplicate query parameters", () => {
    window.location.search = "?param1=value1&param1=value2";
    expect(getQueryParameter("param1")).toBe("value1");
  });
});
