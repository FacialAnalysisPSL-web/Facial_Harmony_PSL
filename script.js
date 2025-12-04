document.getElementById("foto").addEventListener("change", function(event) {
  const archivo = event.target.files[0];

  if (!archivo) {
    return;
  }

  // Crear URL de la imagen
  const urlImagen = URL.createObjectURL(archivo);

  // Poner imagen en el <img>
  const preview = document.getElementById("preview");
  preview.src = urlImagen;
  preview.style.display = "block";

  // Mensaje de prueba (luego aquí irá la armonía real)
  document.getElementById("resultado").innerText =
    "Imagen cargada correctamente. Pronto analizaré la armonía.";
});
