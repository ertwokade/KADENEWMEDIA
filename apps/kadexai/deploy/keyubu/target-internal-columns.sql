COPY (
  SELECT table_schema, table_name, column_name
  FROM information_schema.columns
  WHERE table_schema IN ('auth', 'storage')
  ORDER BY table_schema, table_name, ordinal_position
) TO STDOUT WITH (FORMAT text, DELIMITER E'\t');
