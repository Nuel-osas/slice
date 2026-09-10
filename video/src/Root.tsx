import React from "react";
import { Composition } from "remotion";
import { Mirrl, MIRRL_DURATION } from "./Mirrl";

export const RemotionRoot: React.FC = () => (
  <Composition id="Mirrl" component={Mirrl} durationInFrames={MIRRL_DURATION} fps={30} width={1920} height={1080} />
);
