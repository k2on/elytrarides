import React, { useRef, useEffect } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { Colors } from "@/app/colors";

export default function Loader() {
  const translateX = useRef(new Animated.Value(-Dimensions.get('window').width)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: Dimensions.get('window').width,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -Dimensions.get('window').width,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.loader}>
      <Animated.View style={[styles.bar, { transform: [{ translateX }] }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  loader: {
    height: 2,
    width: '100%',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    position: 'absolute',
    height: 2,
    backgroundColor: Colors.PRIMARY
  },
});

