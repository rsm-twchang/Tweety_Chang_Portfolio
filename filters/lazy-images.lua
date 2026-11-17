-- Load project images lazily and decode them off the main thread.
function Image(img)
  if not img.attributes.loading then img.attributes.loading = "lazy" end
  if not img.attributes.decoding then img.attributes.decoding = "async" end
  return img
end
