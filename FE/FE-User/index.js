import { AppRegistry } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import { name as appName } from "./app.json";

AppRegistry.registerComponent(appName, () => AppNavigator);
export default AppNavigator;