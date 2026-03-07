#!/bin/bash
# Download dictionary source data for Sanskrit Analyzer
# - Monier-Williams (MW) dictionary from CDSL
# - Apte (AP90) dictionary from CDSL
# - INRIA morphological data for stem index

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/data/cdsl"

echo "=== Sanskrit Dictionary Data Setup ==="
echo "Data directory: $DATA_DIR"

mkdir -p "$DATA_DIR"

# Download Monier-Williams dictionary
if [ ! -f "$DATA_DIR/mw.txt" ]; then
  echo ""
  echo "Downloading Monier-Williams dictionary..."
  curl -L -o "$DATA_DIR/mw.txt" \
    "https://raw.githubusercontent.com/sanskrit-lexicon/csl-orig/master/v02/mw/mw.txt"
  echo "MW download complete: $(wc -l < "$DATA_DIR/mw.txt") lines"
else
  echo "MW already downloaded, skipping."
fi

# Download Apte dictionary
if [ ! -f "$DATA_DIR/ap90.txt" ]; then
  echo ""
  echo "Downloading Apte (AP90) dictionary..."
  curl -L -o "$DATA_DIR/ap90.txt" \
    "https://raw.githubusercontent.com/sanskrit-lexicon/csl-orig/master/v02/ap90/ap90.txt"
  echo "AP90 download complete: $(wc -l < "$DATA_DIR/ap90.txt") lines"
else
  echo "AP90 already downloaded, skipping."
fi

# Download INRIA morphological data
if [ ! -f "$DATA_DIR/SL_morph.xml" ]; then
  echo ""
  echo "Downloading INRIA morphological data..."
  curl -L -o "$DATA_DIR/SL_morph.xml.gz" \
    "https://sanskrit.inria.fr/DATA/XML/SL_morph.xml.gz"
  echo "Decompressing..."
  gunzip "$DATA_DIR/SL_morph.xml.gz"
  echo "INRIA data ready."
else
  echo "INRIA data already downloaded, skipping."
fi

echo ""
echo "=== Setup Complete ==="
echo "Files in $DATA_DIR:"
ls -lh "$DATA_DIR/"
