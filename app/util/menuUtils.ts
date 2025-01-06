import React from "react";

export const useListRef = (defaultItems: any[]) => {
    const items = React.useRef<any[]>(defaultItems);

    const handleSelected = (item: any) => {
        items.current.push(item)
    };

    const handleUnSelected = (item: any) => {
        const index: number = items.current.indexOf(item);
    
        if (index != -1) {
            items.current.splice(index, 1);
        }
    }

    return {
        items: items, handleSelected: handleSelected, handleUnSelected: handleUnSelected
    }
}