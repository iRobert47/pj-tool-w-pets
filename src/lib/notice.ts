// 跨平台的小提示：網頁版的 Alert.alert 不會顯示，所以統一改用 App 內的提示條
import { DeviceEventEmitter } from 'react-native';

export const NOTICE = 'pets:notice';

export function notice(title: string, message?: string) {
  DeviceEventEmitter.emit(NOTICE, { title, message });
}
