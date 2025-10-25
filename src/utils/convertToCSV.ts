import { createObjectCsvStringifier } from 'csv-writer';

export const convertToCSV = (data: any[]) => {
    const csv = createObjectCsvStringifier({
        header: [
            { id: 'date', title: 'Date' },
            { id: 'description', title: 'Description' },
            { id: 'amount', title: 'Amount' },
            { id: 'type', title: 'Type' },
        ],
    });
    return csv.getHeaderString() + csv.stringifyRecords(data);
};