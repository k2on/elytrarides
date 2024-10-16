import { Animated, Easing } from 'react-native';
import React, { useEffect, useRef } from 'react';

export default function AnimatedCircle({ children }: any) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 4,
          duration: 1800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
        style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 200,
        height: 200,
        backgroundColor: "grey",
        borderRadius: 100, 
        transform: [
          { translateX: -90 }, // offset for half of the width
          { translateY: -90 }, // offset for half of the height
          { scale: scaleValue }, // scale goes after translate
        ],
        opacity: opacityValue,
        zIndex: 1,
      }}
    />
  );

};

