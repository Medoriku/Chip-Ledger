#!/bin/bash
# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private
# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://chip_ledger_user:3RWIM6LDc1nVlHk5lEUuGcSH7oFU2CxO@dpg-d7g1g6d8nd3s73ed768g-a.oregon-postgres.render.com/chip_ledger"

# Execute each .sql file in the directory
for file in src/init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done
