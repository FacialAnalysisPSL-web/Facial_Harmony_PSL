async function cargarModelos() {
  await faceapi.nets.tinyFaceDetector.loadFromUri("https://cdn.jsdelivr.net/npm/face-api.js/weights/");
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri("https://cdn.jsdelivr.net/npm/face-api.js/weights/");
  console.log("Modelos cargados");
}

cargarModelos();

document.getElementById("foto").addEventListener("change", async function(event) {
  const archivo = event.target.files[0];

  if (!archivo) return;

  // Previsualizar imagen
  const img = document.getElementById("preview");
  img.src = URL.createObjectURL(archivo);
  img.style.display = "block";

  document.getElementById("resultado").innerText = "Analizando rostro...";

  // Esperar a que la imagen cargue
  await new Promise(res => setTimeout(res, 500));

  // Detectar rostro
  const deteccion = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true);

  if (!deteccion) {
    document.getElementById("resultado").innerText =
      "No se detectó el rostro. Intenta otra foto.";
    return;
  }

  const puntos = deteccion.landmarks;

  // Calcular medidas
  const ojoIzq = puntos.getLeftEye();
  const ojoDer = puntos.getRightEye();
  const nariz = puntos.getNose();
  const boca = puntos.getMouth();

  // Distancia entre ojos
  const distanciaOjos =
    Math.abs(ojoIzq[0].x - ojoDer[3].x);

  // Ancho de la nariz
  const anchoNariz =
    Math.abs(nariz[0].x - nariz[6].x);

  // Proporción ideal (nariz ≈ distancia entre ojos)
  let proporcion = 100 - Math.abs(distanciaOjos - anchoNariz);

  if (proporcion < 0) proporcion = 0;
  if (proporcion > 100) proporcion = 100;

  // Promedio de armonía simple
  const armonia = Math.round(proporcion);

  document.getElementById("resultado").innerText =
    "Armonía facial: " + armonia + "/100 ✔️";
});
