import { CompoundButton, makeStyles, ProgressBar } from "@fluentui/react-components";
import { Field } from "@fluentui/react-components";
import { useState } from "react";
import { getRandomKey } from "@/app/util/commonutils";
import { getRequestHeader } from "@/app/util/fetchutils";
import { IScene } from "@/app/interfaces/scenes";
import { IRoutingRequest, IVideohub, RoutingUpdateResult } from "@/app/interfaces/videohub";
import { useTranslations } from "next-intl";

interface InputProps {
  videohub?: IVideohub,
  onRoutingUpdated?: (data: IRoutingRequest) => void,
  pushbuttons: IScene[],
}

const useStyles = makeStyles({
  longText: {
    width: '180px',
    height: '80px',
  },
});

interface RequestState {
  state?: "success" | "error",
  message?: string,
  value?: number,
  hint?: string,
}

export interface RoutingData {
  request?: IRoutingRequest,
  statusKey: number,
}

const RequestStatus = (props: { request?: IRoutingRequest }) => {
  const t = useTranslations('RequestStatus');

  if (props.request == undefined) {
    return <></>
  }

  const getRequestState = (props: { request?: IRoutingRequest }): RequestState => {
    if (props.request != undefined) {
      const res = props.request.result;
      if (res != undefined) {
        if (res.result) {
          return { state: "success", message: "routing.success", value: 1, hint: undefined }
        } else {
          return { state: "error", message: res.message || "", value: 1, hint: undefined }
        }
      }
    }
  
    return { state: undefined, message: undefined, value: undefined, hint: t("pending") }
  }

  const state = getRequestState(props)
  return <Field hint={state.hint} label={t(`title.${state.state != "error" ? "pending":"failed"}`, {scene: props.request.button.label})} validationMessage={state.message == undefined ? undefined : t(`result.${state.message}`)} validationState={state.state}>
    <ProgressBar
      value={state.value} />
  </Field>
}

export function sortButtons(a: IScene, b: IScene): number {
  if (a.display && b.display) {
    if (a.sorting < b.sorting) {
      return -1
    } else if (a.sorting > b.sorting) {
      return 1
    }
  } else {
    if (a.display) {
      return -1
    } else if (b.display) {
      return 1
    }
  }

  return a.label.localeCompare(b.label)
}

export const PushButtonsList = (props: InputProps) => {
  const [request, setRequest] = useState<IRoutingRequest>()
  const styles = useStyles();
  const t = useTranslations('ScenesList');

  const isRequestComplete = () => {
    return request == undefined || request.result != undefined;
  }

  return (
    <>
      {props.pushbuttons.length == 0 ?
        <p>No buttons to display.</p> :
        <>
          <div className="my-4">
            <RequestStatus
              request={request}
            />
          </div>
          <div className="grid justify-items-center space-y-4 md:flex md:justify-items-start md:space-x-4 md:space-y-0">
            {props.pushbuttons.sort(sortButtons).map((button, key) => {
              return (
                <CompoundButton className={styles.longText} disabled={!isRequestComplete()} key={key} secondaryContent={button.description || t("defaultDescription", { amount: button.actions.length })} style={{ backgroundColor: button.color }}
                  onClick={async () => {
                    if (props.videohub == undefined || !isRequestComplete()) {
                      return
                    }

                    const inputs: number[] = []
                    const outputs: number[] = []

                    for (const action of button.actions) {
                      outputs.push(action.output_id)
                      inputs.push(action.input_id)
                    }

                    const req: IRoutingRequest = {
                      id: getRandomKey(),
                      button: button,
                      videohubId: props.videohub.id,
                      outputs: outputs,
                      inputs: inputs,
                    }

                    setRequest(req)

                    const json: RoutingUpdateResult = await (await fetch(`/api/videohubs/${req.videohubId}/routing`, getRequestHeader("POST", req))).json();
                    req.result = json;
                    if (!json.result) {
                      req.result.message = json.message
                    } else {
                      if (props.onRoutingUpdated != undefined) {
                        props.onRoutingUpdated(req)
                      }
                    }

                    setRequest({ ...req })
                  }}>
                  {button.label}
                </CompoundButton>
              );
            })}
          </div>
        </>}
    </>
  );
}