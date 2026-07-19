#!/bin/bash

# Check if at least one file was provided
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 file1.csv file2.csv [file3.csv ...] > output.csv"
    exit 1
fi

# Flag to track if we've processed the first file
is_first=true

# Loop through all files passed as arguments
for file in "$@"; do
    # Verify the file actually exists before processing
    if [ -f "$file" ]; then
        if [ "$is_first" = true ]; then
            # For the first file, keep everything (header + data)
            cat "$file"
            is_first=false
        else
            # For subsequent files, skip the first line (header)
            tail -n +2 "$file"
        fi
    else
        echo "Warning: File '$file' not found. Skipping." >&2
    fi
done