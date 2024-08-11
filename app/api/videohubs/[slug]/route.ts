import { hasRoleOutput, IUser } from "@/app/authentification/interfaces";
import { PERMISSION_VIDEOHUB_EDIT } from "@/app/authentification/permissions";
import { checkServerPermission, getUserFromToken, getUserIdFromToken } from "@/app/authentification/server-auth";
import { ROLE_ADMIN_ID } from "@/app/backend/backend";
import { getPrisma } from "@/app/backend/prismadb";
import { getVideohub, sendRoutingUpdate, updateDefaultInput } from "@/app/backend/videohubs"
import { IVideohub, ViewData } from "@/app/interfaces/videohub"
import { checkHasParams, createResponseInvalid, createResponseValid } from "@/app/util/requestutil";
import { NextRequest } from "next/server";
import { retrieveVideohubsServerSide, getVideohubActivityServerSide, getVideohubFromQuery } from "./server-videohubs";
import { IUpcomingScene } from "@/app/interfaces/scenes";
import { retrievePushButtonsServerSide, retrieveScheduledButtons } from "../../scenes/[slug]/server-scenes";
import { retrieveUserServerSide } from "../../users/[slug]/server-users";

export async function POST(req: NextRequest,
    { params }: { params: { slug: string } }
) {
    const hasPerms = await checkServerPermission(req);
    if (hasPerms != null) {
        return hasPerms;
    }

    const { slug } = params;
    switch (slug) {
        case "setDefaultInput":
        case "updateRouting": {
            const user: IUser | undefined = await getUserFromToken(req)
            if (user == undefined) {
                return createResponseInvalid(req, "User not provided")
            }

            const body = await req.json()
            const videohubId: number = body.videohubId
            const outputs: number[] = body.outputs
            const inputs: number[] = body.inputs;

            const hasParams = checkHasParams(req, videohubId, outputs, inputs);
            if (hasParams != null) {
                return hasParams;
            }

            // check outputs 
            for (const outputId of outputs) {
                if (!hasRoleOutput(user.role, videohubId, outputId)) {
                    return createResponseInvalid(req, "Contains outputs that the user's role doesn't have.")
                }
            }

            if (slug === "setDefaultInput") {
                for (let i = 0; i < outputs.length; i++) {
                    const input: number | undefined = inputs[i] < 0 ? undefined : inputs[i]
                    const output = outputs[i]
                    await getPrisma().output.update({
                        where: {
                            videohub_output: {
                                id: output,
                                videohub_id: videohubId,
                            }
                        },
                        data: {
                            input_default_id: input,
                        }
                    })

                    updateDefaultInput(videohubId, output, input)
                }

                return createResponseValid(req)

            } else {
                return createResponseValid(req, await sendRoutingUpdate(videohubId, outputs, inputs))
            }
        }

        case "update": {
            const hasPerms = await checkServerPermission(req, PERMISSION_VIDEOHUB_EDIT);
            if (hasPerms != null) {
                return hasPerms;
            }

            const videohub: IVideohub = await req.json()
            videohub.name = videohub.name.trim()

            if (videohub.id == -1) {
                await getPrisma().videohub.create({
                    data: {
                        name: videohub.name,
                        ip: videohub.ip,
                        latitude: videohub.latitude,
                        longitude: videohub.longitude,
                        version: videohub.version,
                    }
                })

                // also add outputs to admin
                await getPrisma().roleOutput.createMany({
                    data: videohub.outputs.map(o => {
                        return { output_id: o.id, role_id: ROLE_ADMIN_ID, videohub_id: videohub.id }
                    }),
                })

            } else {
                await getPrisma().videohub.update({
                    where: {
                        id: videohub.id,
                    },
                    data: {
                        ip: videohub.ip,
                        name: videohub.name,
                        version: videohub.version,
                        latitude: videohub.latitude,
                        longitude: videohub.longitude
                    },
                })
            }

            return createResponseValid(req)
        }

        default: {
            return createResponseInvalid(req, "Invalid PID.")
        }
    }
}

export async function GET(req: NextRequest,
    { params }: { params: { slug: string } }
) {

    const hasPerms = await checkServerPermission(req);
    if (hasPerms != null) {
        return hasPerms;
    }

    const { slug } = params;
    switch (slug) {
        case "getVideohub": {
            const videohub = req.nextUrl.searchParams.get("videohub");
            const hasParams = checkHasParams(req, videohub)
            if (hasParams != null) {
                return hasParams;
            }

            return createResponseValid(req, getVideohub(Number(videohub)));
        }

        case "get": {
            return createResponseValid(req, retrieveVideohubsServerSide());
        }
        
        case "getViewData": {
            const videohub = req.nextUrl.searchParams.get("videohub");
            let selected: IVideohub | undefined = videohub ? getVideohub(Number(videohub)) : undefined;
            const hubs: IVideohub[] = retrieveVideohubsServerSide();

            if (selected == undefined) {
                if (hubs.length != 0) {
                    selected = hubs[0];
                }
            }

            const userId: string = await getUserIdFromToken(req)
            let buttons: any[]
            let scheduled: IUpcomingScene[]
            if (selected != undefined) {
                buttons = await retrievePushButtonsServerSide(req, selected.id)
                scheduled = retrieveScheduledButtons(selected.id, userId)
            } else {
                buttons = []
                scheduled = []
            }

            return createResponseValid(req, {
                user: JSON.parse(JSON.stringify(await retrieveUserServerSide(userId))),
                videohubs: JSON.parse(JSON.stringify(hubs)),
                videohub: selected ? selected.id : 0,
                scenes: JSON.parse(JSON.stringify(buttons)),
                upcomingScenes: JSON.parse(JSON.stringify(scheduled))
            } as ViewData);
        }

        case "getActivities": {
            return createResponseValid(req, await getVideohubActivityServerSide())
        }

        default: {
            return createResponseInvalid(req, "Invalid PID.")
        }
    }
}