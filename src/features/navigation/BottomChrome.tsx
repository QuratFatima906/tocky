import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type BottomChromePart = 'tabBar' | 'nowTrackingBar';

type BottomChromeValue = {
  readonly heightByPart: Readonly<Partial<Record<BottomChromePart, number>>>;
  readonly reportHeight: (part: BottomChromePart, height: number) => void;
};

const BottomChromeContext = createContext<BottomChromeValue>({
  heightByPart: {},
  reportHeight: () => {},
});

export function BottomChromeProvider({ children }: { children: ReactNode }) {
  const [heightByPart, setHeightByPart] = useState<Partial<Record<BottomChromePart, number>>>({});

  const reportHeight = useCallback((part: BottomChromePart, height: number) => {
    setHeightByPart((current) =>
      current[part] === height ? current : { ...current, [part]: height },
    );
  }, []);

  const value = useMemo<BottomChromeValue>(
    () => ({ heightByPart, reportHeight }),
    [heightByPart, reportHeight],
  );

  return <BottomChromeContext.Provider value={value}>{children}</BottomChromeContext.Provider>;
}

export function useBottomChromeHeight(): number {
  const { heightByPart } = useContext(BottomChromeContext);

  return Object.values(heightByPart).reduce((total, height) => total + height, 0);
}

export function useBottomChromePartHeight(part: BottomChromePart): number {
  return useContext(BottomChromeContext).heightByPart[part] ?? 0;
}

export function useReportBottomChrome(part: BottomChromePart) {
  const { reportHeight } = useContext(BottomChromeContext);

  useEffect(() => () => reportHeight(part, 0), [part, reportHeight]);

  return useMemo(
    () => ({
      onLayout: ({ nativeEvent }: { nativeEvent: { layout: { height: number } } }) =>
        reportHeight(part, nativeEvent.layout.height),
    }),
    [part, reportHeight],
  );
}
