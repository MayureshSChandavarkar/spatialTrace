import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { createXRStore, XR, XRHand } from '@react-three/xr';

const store = createXRStore({ hand: true });

const BACKEND_URL = 'https://localhost:3001/api/log';

// Throttle: only send one request at a time to avoid flooding
let sending = false;

function KeystoneLogger() {
  const { gl } = useThree();

  useFrame(() => {
    const session = gl.xr.getSession();
    if (!session) return;

    for (const source of session.inputSources) {
      if (!source.hand) continue;

      const refSpace = gl.xr.getReferenceSpace();
      const frame = gl.xr.getFrame();
      if (!frame || !refSpace) continue;

      const indexTipJoint = source.hand.get('index-finger-tip');
      const thumbTipJoint = source.hand.get('thumb-tip');
      if (!indexTipJoint || !thumbTipJoint) continue;

      const indexPose = frame.getJointPose(indexTipJoint, refSpace);
      const thumbPose = frame.getJointPose(thumbTipJoint, refSpace);
      if (!indexPose || !thumbPose) continue;

      const ix = indexPose.transform.position.x;
      const iy = indexPose.transform.position.y;
      const iz = indexPose.transform.position.z;
      const tx = thumbPose.transform.position.x;
      const ty = thumbPose.transform.position.y;
      const tz = thumbPose.transform.position.z;

      const distance = Math.sqrt((ix - tx) ** 2 + (iy - ty) ** 2 + (iz - tz) ** 2);
      const isPinching = distance < 0.02;

      if (isPinching) {
        const payload = {
          hand: source.handedness,
          timestamp: Date.now(),
          indexTip: { x: ix, y: iy, z: iz },
          thumbTip: { x: tx, y: ty, z: tz },
          pinchDistance: distance,
        };

        console.log('[Keystroke Detected]', payload);

        if (!sending) {
          sending = true;
          fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
            .catch((err) => console.warn('Log send failed:', err))
            .finally(() => { sending = false; });
        }
      }
    }
  });

  return null;
}

export default function App() {
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <button onClick={() => store.enterVR()}>Enter VR</button>

      <Canvas>
        <XR store={store}>
          <XRHand hand="left" />
          <XRHand hand="right" />

          <KeystoneLogger />

          {/* Dummy virtual keyboard surface */}
          <mesh position={[0, 1, -0.5]}>
            <boxGeometry args={[0.5, 0.01, 0.2]} />
            <meshBasicMaterial color="#333" />
          </mesh>

          <ambientLight intensity={0.5} />
        </XR>
      </Canvas>
    </>
  );
}
