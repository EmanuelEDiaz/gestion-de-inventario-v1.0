# Manejo de Imágenes

## Configuración

```properties
# application.yml
inventory:
  media:
    root: ${INVENTORY_MEDIA_ROOT:./media}  # Dev: ./media, Docker: /var/lib/inventory/media
```

## Layout de Paths

```
media/
├── users/
│   └── {userId}/
│       └── avatar/
│           ├── original/
│           │   └── {imageId}.{ext}
│           └── thumb/
│               └── 256/
│                   └── {imageId}.jpg
└── products/
    └── {productId}/
        ├── original/
        │   └── {imageId}.{ext}
        └── thumb/
            ├── 256/
            │   └── {imageId}.jpg
            └── 1024/
                └── {imageId}.jpg
```

## Límites

### Avatar
- Tamaño máximo: **2 MiB**
- Dimensiones máximas: **2048×2048**
- 1 avatar activo por usuario (reemplaza anterior)

### Producto
- Tamaño máximo por imagen: **10 MiB**
- Dimensiones máximas: **4096×4096**
- Máximo **8 imágenes** por producto

## Content Types Permitidos

```java
Set<String> ALLOWED_TYPES = Set.of(
    "image/jpeg",
    "image/png",
    "image/webp"
);
```

## Validación

1. Validar `Content-Type` header
2. Validar magic bytes reales del archivo
3. Intentar decodificar imagen para verificar integridad
4. Rechazar si dimensiones exceden límites
5. Rechazar si tamaño excede límites

```java
public void validateImage(byte[] data, String contentType, ImageLimits limits) {
    // 1. Validar content type contra allowlist
    if (!ALLOWED_TYPES.contains(contentType)) {
        throw new InvalidImageException("Content type not allowed: " + contentType);
    }
    
    // 2. Validar tamaño
    if (data.length > limits.maxBytes()) {
        throw new InvalidImageException("Image exceeds size limit");
    }
    
    // 3. Validar magic bytes
    String detectedType = detectMimeType(data);
    if (!detectedType.equals(contentType)) {
        throw new InvalidImageException("Content type mismatch");
    }
    
    // 4. Decodificar y validar dimensiones
    BufferedImage image = ImageIO.read(new ByteArrayInputStream(data));
    if (image == null) {
        throw new InvalidImageException("Unable to decode image");
    }
    if (image.getWidth() > limits.maxWidth() || image.getHeight() > limits.maxHeight()) {
        throw new InvalidImageException("Image dimensions exceed limits");
    }
}
```

## Seguridad

### Path Traversal Prevention

```java
public String buildSafePath(String... segments) {
    Path base = Path.of(mediaRoot).toAbsolutePath().normalize();
    Path full = base;
    
    for (String segment : segments) {
        // Rechazar segmentos peligrosos
        if (segment.contains("..") || segment.contains(":") || 
            segment.startsWith("/") || segment.startsWith("\\")) {
            throw new SecurityException("Invalid path segment: " + segment);
        }
        full = full.resolve(segment);
    }
    
    // Verificar que sigue dentro de base
    full = full.normalize();
    if (!full.startsWith(base)) {
        throw new SecurityException("Path escapes media root");
    }
    
    return base.relativize(full).toString();
}
```

### Escritura Atómica

```java
public void writeAtomic(Path target, byte[] data) throws IOException {
    Path temp = target.resolveSibling(target.getFileName() + ".tmp");
    Files.createDirectories(target.getParent());
    Files.write(temp, data, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
    Files.move(temp, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
}
```

### Acceso por Endpoint

- **Nunca** exponer rutas del filesystem al cliente
- Servir imágenes por endpoint autenticado: `GET /api/v1/users/{id}/avatar`
- Responder con `Content-Type` correcto y `Content-Disposition: inline`

## Thumbnails

### Generación

- Se generan al subir (inline o job corto)
- Formato de salida: JPEG (excepto PNG con transparencia si es estrictamente necesario)
- Calidad JPEG: 85%

### Tamaños

| Variante | Uso |
|----------|-----|
| thumb/256 | Listados, avatares |
| thumb/1024 | Detalle de producto (solo productos) |

```java
BufferedImage resize(BufferedImage original, int targetSize) {
    int width = original.getWidth();
    int height = original.getHeight();
    
    if (width <= targetSize && height <= targetSize) {
        return original; // No resize needed
    }
    
    double scale = Math.min((double) targetSize / width, (double) targetSize / height);
    int newWidth = (int) (width * scale);
    int newHeight = (int) (height * scale);
    
    BufferedImage resized = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
    Graphics2D g = resized.createGraphics();
    g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
    g.drawImage(original, 0, 0, newWidth, newHeight, null);
    g.dispose();
    
    return resized;
}
```

## Offline (Frontend)

### IndexedDB Cache

- Cachear thumbnails 256 (no originales)
- Política: LRU
- Límite: **50 MiB**

```typescript
interface ImageCache {
  key: string        // "product:{id}:thumb256" o "user:{id}:avatar"
  data: Blob
  cachedAt: number
  size: number
}
```

### UI Fallback

- Mostrar placeholder si imagen no disponible
- Skeleton loader mientras carga
- Indicador si solo disponible offline
