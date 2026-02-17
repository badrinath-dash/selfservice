// --- UPDATED SORTING LOGIC ---
    const sortedResults = useMemo(() => {
        const copy = [...filteredResults];
        
        // 1. Parse the sort selection (e.g., "index_size_mb:desc")
        // If sortType is simple "index_name", default to asc
        const [key, direction] = String(sortType).includes(':') 
            ? sortType.split(':') 
            : [sortType, 'asc'];

        const isDesc = direction === 'desc';

        copy.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            // 2. Handle nulls/undefined (always push to bottom)
            if (valA == null && valB == null) return 0;
            if (valA == null) return 1;
            if (valB == null) return -1;

            // 3. numeric detection
            // We check if the string is purely numeric (e.g. "1024", "50.5")
            // This prevents "100" from coming before "2" in string sort
            const numA = Number(valA);
            const numB = Number(valB);
            
            if (!isNaN(numA) && !isNaN(numB)) {
                return isDesc ? numB - numA : numA - numB;
            }

            // 4. String comparison (case-insensitive)
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();

            if (strA < strB) return isDesc ? 1 : -1;
            if (strA > strB) return isDesc ? -1 : 1;
            return 0;
        });

        return copy;
    }, [filteredResults, sortType]);
