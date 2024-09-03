export const showNotification = (title: string, options: NotificationOptions) => {
    new Notification(title, options);
}

export const isNotificationGranted = () => {
    return Notification.permission === "granted";
}

export const requestNotificationPermission = () => {
    if (!("Notification" in window)) {
        console.log("Browser does not support desktop notification");
    } else {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }
}

