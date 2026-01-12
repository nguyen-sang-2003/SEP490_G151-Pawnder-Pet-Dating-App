declare module 'react-native-maps' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface LatLng {
    latitude: number;
    longitude: number;
  }

  export interface Region extends LatLng {
    latitudeDelta: number;
    longitudeDelta: number;
  }

  export interface MapViewProps extends ViewProps {
    initialRegion?: Region;
    region?: Region;
    onLongPress?: (event: { nativeEvent: { coordinate: LatLng } }) => void;
    showsUserLocation?: boolean;
    scrollEnabled?: boolean;
    zoomEnabled?: boolean;
    rotateEnabled?: boolean;
    pitchEnabled?: boolean;
  }

  export default class MapView extends React.Component<MapViewProps> {}

  export interface MarkerProps {
    coordinate: LatLng;
    draggable?: boolean;
    onDragEnd?: (event: { nativeEvent: { coordinate: LatLng } }) => void;
  }

  export class Marker extends React.Component<MarkerProps> {}
}
