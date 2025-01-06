"use client"

import { Alert, AlertProps } from "@fluentui/react-components/unstable"
import {
  useId,
  Button,
  Spinner,
  Avatar,
  Toaster,
  useToastController,
  ToastTitle,
  Toast,
  ToastIntent,
} from "@fluentui/react-components";
import React from "react";


export const AlertMessage = (props: { message: string } & AlertProps) => {
  return (
    <Alert
      {...props}>
      {props.message}
    </Alert>
  )
}

export const sendToast = (dispatchToast: any, intent: ToastIntent | "progress" | "avatar", message: string, timeout: number) => {

  switch (intent) {
    case "progress":
      dispatchToast(
        <Toast>
          <ToastTitle media={<Spinner size="tiny" />}>
            Progress toast
          </ToastTitle>
        </Toast>
      );
      break;
    case "avatar":
      dispatchToast(
        <Toast>
          <ToastTitle media={<Avatar name="Erika Mustermann" size={16} />}>
            Avatar toast
          </ToastTitle>
        </Toast>
      );
      break;
    case "error":
    case "info":
    case "success":
    case "warning":
      dispatchToast(
        <Toast>
          <ToastTitle>{message}</ToastTitle>
        </Toast>,
        { pauseOnHover: true, timeout: timeout, intent: intent }
      )

      break
  }
}

export const Intent = () => {
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const [intent, setIntent] = React.useState<
    ToastIntent | "progress" | "avatar"
  >("success");
  const notify = () => {
    switch (intent) {
      case "progress":
        dispatchToast(
          <Toast>
            <ToastTitle media={<Spinner size="tiny" />}>
              Progress toast
            </ToastTitle>
          </Toast>
        );
        break;
      case "avatar":
        dispatchToast(
          <Toast>
            <ToastTitle media={<Avatar name="Erika Mustermann" size={16} />}>
              Avatar toast
            </ToastTitle>
          </Toast>
        );
        break;
      case "error":
      case "info":
      case "success":
      case "warning":
        dispatchToast(
          <Toast>
            <ToastTitle>Toast intent: {intent}</ToastTitle>
          </Toast>,
          { intent }
        );
        break;
    }
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
    </>
  );
};


export const ToastMessage = (props: { message: string, intent: ToastIntent }) => {
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const [intent, setIntent] = React.useState<ToastIntent>("success");

  switch (props.intent) {
    case "error":
    case "info":
    case "success":
    case "warning": {
      return dispatchToast(
        <Toast>
          <ToastTitle>{props.message}</ToastTitle>
        </Toast>,
        { intent }
      )
    }

    default:
      break
  }
}