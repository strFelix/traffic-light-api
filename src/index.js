import 'dotenv/config';
import express from 'express';
import sse from 'better-sse';
const app = express();

const TIME_IN_MILLISECONDS = (time) => time * 1000;

const toggleTrafficLightColor = (currentColor) => {
  return currentColor === 'GREEN' ? 'RED' : 'GREEN';
};

const colorsMap = new Map([
  ['RED', { time: 20 }],
  ['GREEN', { time: 40 }],
]);

const pushMessage = (session, color, timeLeft) => {
  session.push({ color, timeLeft }, 'trafficLightUpdate');
};

const handleSSE = async (request, response) => {
  const { createSession } = sse;
  const session = await createSession(request, response);
  let currentColor = 'GREEN';
  let remainingTime = colorsMap.get(currentColor).time;

  pushMessage(session, currentColor, remainingTime);

  const interval = setInterval(() => {
    remainingTime--;

    if (remainingTime === 0) {
      currentColor = toggleTrafficLightColor(currentColor);
      remainingTime = colorsMap.get(currentColor).time;
    }

    pushMessage(session, currentColor, remainingTime);
  }, TIME_IN_MILLISECONDS(1)); // Update every second

  request.on('close', () => {
    clearInterval(interval);
  });
};

app.get('/sse', handleSSE);

app.listen(process.env.PORT || 3000);
