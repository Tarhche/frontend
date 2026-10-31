import {act, renderHook} from "@testing-library/react";
import {useLongerThan} from "./use-longer-than";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useLongerThan", () => {
  it("is false until what is going on has gone on for long enough", () => {
    const {result} = renderHook(() => useLongerThan(true, 300));

    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(299));
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  it("is never true for what is over sooner", () => {
    const {result, rerender} = renderHook(
      ({going}) => useLongerThan(going, 300),
      {initialProps: {going: true}},
    );

    act(() => jest.advanceTimersByTime(200));
    rerender({going: false});
    act(() => jest.advanceTimersByTime(500));

    expect(result.current).toBe(false);
  });

  it("is false as soon as it stops, and timed afresh when it goes on again", () => {
    const {result, rerender} = renderHook(
      ({going}) => useLongerThan(going, 300),
      {initialProps: {going: true}},
    );

    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe(true);

    rerender({going: false});
    expect(result.current).toBe(false);

    rerender({going: true});
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe(true);
  });
});
