import React from "react"
import OptimizelyLogo from "../optimizely-logo";
import { colors } from "../constants";
const AuthButton = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox='0 0 200 40'
      width={200} height={40}
      {...props}
    >
      <title>
        ConnectWithOptimizelyButton
      </title>
      <rect width="200" height="40" x="0" y="0" rx="6" ry="6" fill={colors.optimizelyBlue}/>
      <g transform={"translate(5, 9)"}>
          <OptimizelyLogo width={"25"} height={"25"} arccolor={colors.white}/>
      </g>
      <g transform={"translate(32, 22)"}>
          <text x={0} y ={5} fill={'white'}> Connect with Optimizely </text>
      </g>
    </svg>
  )
};

export default AuthButton;
