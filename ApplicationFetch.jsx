import { useRef, useCallback } from "react";
import { makeCancelable } from "@splunk/ui-utils/promise";
import { searchKVStore } from "../../common/ManageKVStore";

export const isApplicationOption = (app) => app.matchRanges != undefined;

export default function useFetchOptions({
  fetchTimeout = 600,
  fetchMoreTimeout = 200,
  numberOfResults = 20
} = {}) {
  const currentFetch = useRef(0);
  const currentOptions = useRef([]);
  const fetching = useRef(false);
  const filterRef = useRef("");
  const firstIndex = useRef(0);
  const lastIndex = useRef(numberOfResults);
  const list = useRef([]);
  const timerRef = useRef(null);
  const fetchPromise = useRef(null);
  const fullList = useRef([]); // store all apps once fetched

  const reset = useCallback(() => {
    firstIndex.current = 0;
    lastIndex.current = numberOfResults;
    currentOptions.current = [];
    list.current = [];
  }, [numberOfResults]);

  async function fetchApplicationDetails(){
    const defaultErrorMsg="There is some error in data retrieval from SPLUNK KV Store, please try again"

    return searchKVStore('ability_app_details_collection', '', '', defaultErrorMsg)
    .then((response) => {
        if (!response.ok){
            throw new Error("No Application found"); 
        }
        return response.json();
    });
    

  }
  const fetchDataFromKVStore = async (filter = '') => {
    // Fetch from KV store only once, cache in fullList
    if (fullList.current.length === 0) {
      fullList.current = await fetchApplicationDetails();
    }

    const filtered = filter
      ? fullList.current.filter(app =>
          app.related_app_name?.toLowerCase().startsWith(filter.toLowerCase())
        )
      : fullList.current;

    const slice = filtered.slice(firstIndex.current, lastIndex.current);

    return slice.map((item) => ({
      id: item._key,
      title: item.related_app_name,
      product_owner: item.product_owner,
      group_owner: item.group_owner,
      application_type: item.application_typem,
      application_status: item.application_status,
      e8_category:item.e8_category,
      matchRanges: filter ? [{ start: 0, end: filter.length }] : undefined
    }));
  };

  const fetch = useCallback(
    (filter, timeout = fetchTimeout) => {
      if (!list.current.length || filterRef.current !== filter) {
        reset();
      }
      filterRef.current = filter || "";

      if (fetching.current) {
        currentFetch.current += timeout;
      } else {
        currentFetch.current = timeout;
      }
      fetching.current = true;

      const p = makeCancelable(
        new Promise((resolve, reject) => {
          timerRef.current = setTimeout(async () => {
            try {
              const options = await fetchDataFromKVStore(filter);
              fetching.current = false;
              currentOptions.current = options;
              list.current = options;
              resolve(options);
            } catch (err) {
              reject(err);
            }
          }, currentFetch.current);
        })
      );

      fetchPromise.current = p;
      return p.promise;
    },
    [fetchTimeout, reset]
  );

  const fetchMore = useCallback(
    (opts = []) => {
      currentOptions.current = opts;
      firstIndex.current += numberOfResults;
      lastIndex.current += numberOfResults;
      return fetch(filterRef.current, fetchMoreTimeout);
    },
    [fetch, fetchMoreTimeout, numberOfResults]
  );

  const stop = useCallback(() => {
    fetchPromise.current?.cancel();
  }, []);

  const getOption = useCallback(
    (value) => currentOptions.current.find((item) => item.id === value),
    []
  );

  const getSelectedOptions = useCallback(
    (values) => currentOptions.current.filter((item) => values.includes(item.id)),
    []
  );

  const getCurrentCount = useCallback(() => list.current.length, []);
  const getFullCount = useCallback(() => fullList.current.length, []);

  return {
    fetch,
    fetchMore,
    reset,
    stop,
    getOption,
    getSelectedOptions,
    getCurrentCount,
    getFullCount
  };
}
