import "core-js/es/promise"
import { useRef, useCallback } from "react"

import { makeCancelable } from "@splunk/ui-utils/promise"

import moviesJson from "./movies.json"

function isMovieOption(movie) {
  return movie.matchRanges !== undefined
}

// Webpack 5 doesn't work well with "import { movies } from './movies.json';" so destructure here
const { movies } = moviesJson

/**
 * @param fetchTimeout: number - The number of milliseconds to defer fetching of options.
 * @param fetchMoreTimeout: number - The number of milliseconds to defer fetching additional options.
 * @param numberOfResults: number - Then number of options to retrieve per fetch.
 */
export default function useFetchOptions({
  fetchTimeout = 600,
  fetchMoreTimeout = 200,
  numberOfResults = 20
} = {}) {
  const currentFetch = useRef(0)
  const currentOptions = useRef([])
  const fetching = useRef(false)
  const filterRef = useRef("")
  const firstIndex = useRef(0)
  const lastIndex = useRef(numberOfResults)
  const list = useRef([])
  const timerRef = useRef(null)
  const fetchPromise = useRef(null)

  /**
   * Resets firstIndex, LastIndex, currentOptions and list to default values.
   */
  const reset = useCallback(() => {
    firstIndex.current = 0
    lastIndex.current = numberOfResults
    currentOptions.current = []
    list.current = []
  }, [numberOfResults])

  const filterResults = useCallback(filter => {
    if (!filter) return movies
    return movies.filter(m =>
      m.title.toLowerCase().startsWith(filter.toLowerCase())
    )
  }, [])

  const concatAndFilter = useCallback(
    (options, filter) => {
      const slice = filterResults(filter).slice(
        firstIndex.current,
        lastIndex.current
      )
      const newOpts = slice.map(m => ({
        id: m.id,
        title: m.title,
        matchRanges: filter ? [{ start: 0, end: filter.length }] : undefined
      }))
      return options.concat(newOpts)
    },
    [filterResults]
  )

  /**
   * Fake fetches options from a server.
   * @param filter: string - filter options.
   * @param timeout: number - Number of milliseconds to defer fetch.
   * @return A promise that will resolve based on the fetchTimeout value.
   *         Returns array of new options.
   */
  const fetch = useCallback(
    (filter, timeout = fetchTimeout) => {
      if (!list.current.length || filterRef.current !== filter) {
        reset()
      }
      filterRef.current = filter || ""

      // If currently fetching, add timeout of previous fetch to current timeout
      if (fetching.current) {
        currentFetch.current += timeout
      } else {
        currentFetch.current = timeout
      }
      fetching.current = true

      const p = makeCancelable(
        new Promise(resolve => {
          timerRef.current = setTimeout(() => {
            fetching.current = false
            list.current = concatAndFilter(currentOptions.current, filter)
            if (timerRef.current) clearTimeout(timerRef.current)
            resolve(list.current)
          }, currentFetch.current)
        })
      )

      fetchPromise.current = p
      return p.promise
    },
    [fetchTimeout, concatAndFilter, reset]
  )

  /**
   * Increases searching index for new options and runs fetch.
   * @param currentOptions: array - Append options to given array.
   * @return A promise that will resolve based on the fetchTimeout value.
   *         Returns array of new options appended to currentOptions.
   */
  const fetchMore = useCallback(
    (opts = []) => {
      currentOptions.current = opts
      firstIndex.current += numberOfResults
      lastIndex.current += numberOfResults
      return fetch(filterRef.current, fetchMoreTimeout)
    },
    [fetch, fetchMoreTimeout, numberOfResults]
  )

  /**
   * Cancels pending fetch promises.
   */
  const stop = useCallback(() => {
    fetchPromise.current?.cancel()
  }, [])

  /**
   * @return Option of given value;
   */
  const getOption = useCallback(value => movies.find(m => m.id === value), [])

  /**
   * @return Options of given values;
   */
  const getSelectedOptions = useCallback(
    values => movies.filter(m => values.includes(m.id)),
    []
  )

  /**
   * Get current length of indexes fetched.
   */
  const getCurrentCount = useCallback(() => list.current.length, [])

  /**
   * Get full count of all possible items fetched.
   */
  const getFullCount = useCallback(() => {
    return filterRef.current
      ? filterResults(filterRef.current).length
      : movies.length
  }, [filterResults])

  return {
    fetch,
    fetchMore,
    reset,
    stop,
    getOption,
    getSelectedOptions,
    getCurrentCount,
    getFullCount
  }
}

export { isMovieOption }
