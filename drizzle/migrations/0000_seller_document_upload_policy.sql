CREATE POLICY "Public seller document uploads are allowed"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'seller-documents'
  AND name LIKE 'seller-uploads/%'
);
