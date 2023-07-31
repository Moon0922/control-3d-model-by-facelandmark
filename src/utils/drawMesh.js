import { TRIANGULATION } from "./triangulation";

export const drawMesh = (prediction, ctx) => {
  if (!prediction) return;
  const keyPoints = prediction.keypoints;
  if (!keyPoints) return;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let i = 0; i < TRIANGULATION.length / 3; i++) {
    const points = [
      TRIANGULATION[i * 3],
      TRIANGULATION[i * 3 + 1],
      TRIANGULATION[i * 3 + 2],
    ].map((index) => keyPoints[index]);
    drawPath(ctx, points, true);
  }
  //drawPath(ctx, keyPoints, true);
  // ctx.font = "80px serif";
  // ctx.fillText("0", keyPoints[0].x, keyPoints[0].y);
  for (let i = 0; i < keyPoints.length; i++) {
    ctx.beginPath();
    ctx.arc(keyPoints[i].x, keyPoints[i].y, 1, 0, 10 * Math.PI);
    if(i == 14 || i == 13 || i == 62 || i == 292) //lip 13: top, 14: bottom, 62: left, 292: right
      ctx.fillStyle = "red";
    else if(i == 33 || i == 133 || i == 362 || i == 263 || i == 386 || i == 374 || i == 159 || i == 145) // 33: left_eye_left, 133: left_eye_right, 362:right_eye_left, 263: right_eye_right
      ctx.fillStyle = "yellow";
    else
      ctx.fillStyle = "blue";
    ctx.fill();
  }
};

const drawPath = (ctx, points, closePath) => {
  const region = new Path2D();
  
  region.moveTo(points[0].x, points[0].y);
  // const point = points[1];
  // region.lineTo(point.x, point.y);
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    // if(i == 60)
    //     ctx.fillText(i, point.x, point.y);
    region.lineTo(point.x, point.y);
  }
  if (closePath) region.closePath();
  ctx.stokeStyle = "black";
  ctx.stroke(region);
};
