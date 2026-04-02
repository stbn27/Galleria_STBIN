from PIL import Image, ImageDraw

def create_placeholder_icon(path):
    # Crear una imagen de 512x512 con fondo oscuro
    img = Image.new('RGB', (512, 512), color='#0d0d0f')
    draw = ImageDraw.Draw(img)
    
    # Dibujar un círculo con el color de acento
    margin = 50
    draw.ellipse([margin, margin, 512-margin, 512-margin], outline='#4f7dff', width=10)
    
    # Dibujar un rectángulo interior simbolizando una foto
    photo_margin = 150
    draw.rectangle([photo_margin, photo_margin, 512-photo_margin, 512-photo_margin], outline='#ffffff', width=5)
    
    # Guardar como PNG real
    img.save(path, 'PNG')
    print(f"Icono generado exitosamente en {path}")

if __name__ == "__main__":
    import os
    target_path = "/home/esteban/Documentos/python/galeria_v2/proyecto/src-tauri/assets/app-icon.png"
    # Asegurar que el directorio existe
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    create_placeholder_icon(target_path)
