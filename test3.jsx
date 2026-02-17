const filteredResults = useMemo(() => {

        const isInternalIndex = (row) => {
            // Option 1: infer from name
            const name = (row?.index_name ?? '').toString();
            return name.startsWith('_');
        };

        return assetValues.filter((row) => {
            // 1. Search bar logic
            const matchesSearch = (row?.[searchFilterName] ?? '').toString().toLowerCase().includes(normalizedSearch);

            // 2. Status logic
            const matchesStatus = activeFilters.activeOnly === 'all' ||
                (activeFilters.activeOnly === 'active' ? row.index_active : !row.index_active);

            // 3. Type logic
            const rowType = (row.index_type || '').toLowerCase();
            const matchesType =
                activeFilters.type === 'all' || rowType === activeFilters.type;

            // 4. Internal Index logic
            const internal = isInternalIndex(row);
            const matchesInternal =
                activeFilters.showInternal === 'all' ||
                (activeFilters.showInternal === 'exclude' ? !internal : internal);

            // FIX: Added '&& matchesInternal' to the return statement
            return matchesSearch && matchesStatus && matchesType && matchesInternal;
        });
    }, [assetValues, searchFilterName, normalizedSearch, activeFilters]);
