-- Fix extension in public schema warning by moving extensions to extensions schema
-- Note: This addresses the WARN about extensions in public schema
-- Most common extensions that should be moved out of public:
-- First check what extensions are in public schema
SELECT extname, nspname 
FROM pg_extension e 
JOIN pg_namespace n ON e.extnamespace = n.oid 
WHERE n.nspname = 'public';