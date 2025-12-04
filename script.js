// script.js — explicación abajo

const imageUpload = document.getElementById('imageUpload');
const inputImage = document.getElementById('inputImage');
const canvas = document.getElementById('outputCanvas');
const scoreText = document.getElementById('scoreText');
const ratiosList = document.getElementById('ratiosList');

// Carga modelos: asumimos que hay una carpeta /models en el mismo repo
async function loadModels(){
  const MODEL_URL = './models';
  // faceapi.nets.faceLandmark68Net es el que detecta 68 puntos de la cara
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
}

// Función para medir distancia entre dos puntos
function dist(a,b){
  return Math.hypot(a.x-b.x, a.y-b.y);
}

// Calcula métricas simples de armonía
function computeHarmony(landmarks){
  // extraemos puntos clave por índice (según face-api 68 landmarks)
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();
  const mouth = landmarks.getMouth();
  const jaw = landmarks.getJawOutline();

  // ejemplos de distancias
  const eyeCenter = { x: (leftEye[0].x + rightEye[3].x)/2, y: (leftEye[0].y + rightEye[3].y)/2 };
  const pupLeft = leftEye[0];
  const pupRight = rightEye[3];

  const interEye = dist(pupLeft, pupRight);
  const noseWidth = dist(nose[0], nose[6]);
  const mouthWidth = dist(mouth[0], mouth[6]);
  const faceHeight = dist(jaw[0], nose[3]); // aproximación

  // Proporciones ideales (valores de referencia, aproximados)
  const ratios = {
    eye_to_eye_over_mouth: interEye / mouthWidth,
    nose_over_mouth: noseWidth / mouthWidth,
    intereye_over_faceheight: interEye / faceHeight
  };

  // ideales (ejemplo). En la práctica podrías ajustar o calibrar.
  const ideal = {
    eye_to_eye_over_mouth: 1.0,
    nose_over_mouth: 0.4,
    intereye_over_faceheight: 0.35
  };

  // calculamos desviación porcentual y una puntuación
  let score = 100;
  const details = [];
  for(const k in ratios){
    const val = ratios[k];
    const id = ideal[k];
    const diff = Math.abs(val - id) / id; // % de desviación
    const partScore = Math.max(0, 100 - diff*100); // 100 si perfecto, menos si se aleja
    score = Math.min(score, partScore); // penalizamos por la peor medida
    details.push({ name: k, value: val.toFixed(2), ideal: id, diff: (diff*100).toFixed(1) + '%' });
  }

  return { score: Math.round(score), details };
}

// Dibuja landmarks sobre el canvas
function drawDetections(img, detections){
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;

  const points = detections.landmarks.positions;
  for(const p of points){
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,0,0,0.8)';
    ctx.fill();
  }
}

// Manejo cuando el usuario sube una imagen
imageUpload.addEventListener('change', async () =>{
  const file = imageUpload.files[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  inputImage.src = url;
  inputImage.onload = async () =>{
    // detectar
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 });
    const detection = await faceapi.detectSingleFace(inputImage, options).withFaceLandmarks();
    if(!detection){
      scoreText.textContent = 'No se detectó una cara, prueba con otra foto (frente, buena iluminación).';
      return;
    }
    drawDetections(inputImage, detection);

    const result = computeHarmony(detection.landmarks);
    scoreText.textContent = `Puntuación de armonía: ${result.score} / 100`;
    ratiosList.innerHTML = '';
    for(const d of result.details){
      const li = document.createElement('li');
      li.textContent = `${d.name}: ${d.value} (ideal ${d.ideal}) — desviación ${d.diff}`;
      ratiosList.appendChild(li);
    }
  };
});

// Inicio: carga modelos
(async ()=>{
  scoreText.textContent = 'Cargando modelos, espera...';
  await loadModels();
  scoreText.textContent = 'Modelos listos. Sube una foto.';
})();
