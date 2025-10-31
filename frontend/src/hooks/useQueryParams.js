import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";

export const useQueryParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const setQuery = useCallback(
    (params) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  return {
    queryParams: Object.fromEntries(searchParams.entries()),
    setQuery,
  };
};
