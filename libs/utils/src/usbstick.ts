import { sleep } from './sleep'

export const FLUSH_IO_DELAY_MS = 10_000

const isAvailable = () => {
  return !!window.kiosk
}

export enum UsbDriveStatus {
  notavailable = 'notavailable',
  absent = 'absent',
  present = 'present',
  mounted = 'mounted',
  recentlyEjected = 'recentlyEjected',
  ejecting = 'ejecting',
}

const getDevice = async (): Promise<KioskBrowser.UsbDrive | undefined> => {
  return (await window.kiosk?.getUsbDrives())?.[0]
}

export const getDevicePath = async (): Promise<string | undefined> => {
  const device = await getDevice()
  return device?.mountPoint
}

export const getStatus = async (): Promise<UsbDriveStatus> => {
  if (!isAvailable()) {
    return UsbDriveStatus.notavailable
  }

  const device = await getDevice()

  if (!device) {
    return UsbDriveStatus.absent
  }

  if (device.mountPoint) {
    return UsbDriveStatus.mounted
  }
  return UsbDriveStatus.present
}

export const doMount = async (): Promise<void> => {
  const device = await getDevice()
  if (!device || device.mountPoint) {
    return
  }

  await window.kiosk!.mountUsbDrive(device.deviceName)
}

export const doUnmount = async (): Promise<void> => {
  const device = await getDevice()
  if (!device?.mountPoint) {
    return
  }
  await window.kiosk!.unmountUsbDrive(device.deviceName)
  return await sleep(FLUSH_IO_DELAY_MS)
}
