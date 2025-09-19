"use client"

import client from "@/client";
import View from "@/components/View";
import ViewCentered from "@/components/ViewCentered";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
// import { Dialog, DialogContent } from "@/components/ui/dialog-mobile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useGetMeAccountQuery, useUpdateAccountMutation } from "@/shared";
import { ChangeEventHandler, createRef, useCallback, useEffect, useState } from "react";
import ReactCrop, { Crop } from "react-image-crop";
import Skeleton from "react-loading-skeleton";
import 'react-image-crop/dist/ReactCrop.css'
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog-mobile";
import { URL_UPLOAD } from "@/const";
import { auth_token_get } from "@/store";
import { getImageId } from "@/lib";

const NO_NAME = "Anonymous";
const NO_IMAGE = "https://t4.ftcdn.net/jpg/02/15/84/43/240_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg";

const isValidName = (name: string) => name.trim().length > 0

// <View>
//     <input type="file" accept="image/*" capture="environment" onChange={handleCapture} />
//     {photo && <img src={photo as any} alt="Captured" />}
// </View>

export interface MediaResponse {
    id: string;
}

export default function Account() {
    const [name, setName] = useState("");
    const [open, setOpen] = useState(false);

    const ref = createRef<HTMLImageElement>();
    const [src, setSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);


    const [imageUrl, setImageUrl] = useState(NO_IMAGE);
    const [profileImage, setProfileImage] = useState<string>();

    const [isUploading, setIsUploading] = useState(false);


    const { data, isLoading, error } = useGetMeAccountQuery(client, undefined, {
        onSuccess(data) {
            const name = data.users.me.name;
            if (name != NO_NAME) setName(name);
            if (data.users.me.imageUrl) setImageUrl(data.users.me.imageUrl);
            if (data.users.me.imageUrl) setProfileImage(getImageId(data.users.me.imageUrl));
        },
    });

    const { mutate, isLoading: isLoadingMutation } = useUpdateAccountMutation(client, {
        onSuccess() {
            const location = window.location.href.includes("?r=")
                ? window.location.href.split("?r=")[1]
                : "/";

            window.location.href = location;
        },
    })

    const onSave = () => mutate({ name, profileImage });

    const handleFileChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                const src = reader.result as any;
                setSrc(src);
                if (crop) {
                    const croppedImageUrl = getCroppedImg(src, crop);
                    setCroppedImageUrl(croppedImageUrl);
                }
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onCropComplete = (crop: Crop) => {
        if (src && crop.width && crop.height) {
            const croppedImageUrl = getCroppedImg(src, crop);
            setCroppedImageUrl(croppedImageUrl);
        }
    };

    const getCroppedImg = (imageSrc: string, crop: Crop): string => {
        const image = new Image();
        image.src = imageSrc;
        const canvas = document.createElement('canvas');

        const scale = image.height > image.width ? image.width / crop.width : image.height / crop.height;

        canvas.width = crop.width ?? 0;
        canvas.height = crop.height ?? 0;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(
                image,
                (crop.x ?? 0) * scale,
                (crop.y ?? 0) * scale,
                (crop.width ?? 0) * scale,
                (crop.height ?? 0) * scale,
                0,
                0,
                canvas.width,
                canvas.height
            );
        }

        return canvas.toDataURL('image/jpeg');
    };

    const onUpload = async () => {
        if (!croppedImageUrl) return console.error("No cropped image url");
        setIsUploading(true);

        const response = await fetch(croppedImageUrl);
        const blob = await response.blob();

        const file = new File([blob], 'profile_image.jpg', { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('profile_image', file);

        try {
            const url = URL_UPLOAD + "profile_image";
            const response = await fetch(url, {
                method: "POST",
                body: formData,
                headers: {
                    Authorization: auth_token_get() || "",
                }
            });
            if (!response.ok) return console.error("Could not upload image");
            const json = await response.json() as MediaResponse;
            setProfileImage(json.id);
            setOpen(false);
            const base = process.env.NODE_ENV == "production" ? "https://ride.koon.us/images/" : "http://localhost:8000/images/";
            const imgUrl = base + json.id + ".jpg";
            setImageUrl(imgUrl)
        } catch (e) {
            console.error("Error uploading image", e);
        } finally {
            setIsUploading(false);
        }
    }


    return <>
        <Dialog open={open} onOpenChange={() => setOpen(!open)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Profile Picture</DialogTitle>
                    <DialogDescription>{imageUrl == NO_IMAGE ? "Upload" : "Change"} your profile picture</DialogDescription>
                </DialogHeader>
                <View className="grid w-full items-center gap-1.5">
                    <Input onChange={handleFileChange} accept="image/*" capture="environment" id="picture" type="file" />
                    {src && (
                        <ReactCrop
                            crop={crop}
                            aspect={1}
                            circularCrop
                            onComplete={onCropComplete}
                            locked
                            onChange={newCrop => setCrop(newCrop)}>
                            <img onLoad={(e) => {
                                const imageWidth = e.currentTarget.width;
                                const imageHeight = e.currentTarget.height;
                                const smallest = Math.min(imageWidth, imageHeight);
                                const width = smallest;
                                const height = smallest;
                                const x = (imageWidth - width) / 2;
                                const y = (imageHeight - height) / 2;
                                setCrop({ x, y, width, height, unit: "px" });
                            }} ref={ref} src={src} />
                      </ReactCrop>
                  )}
                  <Button disabled={isUploading} onClick={onUpload}>{isUploading ? "Uploading..." : "Next"}</Button>
                </View>
            </DialogContent>
        </Dialog>
        <ViewCentered>
            <Card className="border-none sm:border-solid w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Edit your Elytra account</CardDescription>
                </CardHeader>
                <CardContent>
                    <View onClick={() => {
                        setSrc(null);
                        setOpen(!open);
                    }}>
                        <img className="rounded-full w-24 h-24 mx-auto" src={imageUrl} />
                        <Button className="mx-auto block" variant="link">{imageUrl == NO_IMAGE ? "Upload" : "Change"} Profile Picture</Button>
                    </View>
                    <br />
                    <View className="inline w-full max-w-sm items-center gap-1.5">
                      <Label className="mb-2 block" htmlFor="name">Name</Label>
                      {!isLoading ? <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} type="name" id="name" placeholder="Name" /> : <Skeleton height={40} className="w-full" />}
                    </View>
                </CardContent>
                <CardFooter>
                    <Button onClick={onSave} disabled={!isValidName(name) || isLoadingMutation} className="w-full">{isLoadingMutation ? "Saving..." : "Save"}</Button>
                </CardFooter>
            </Card>
        </ViewCentered>
    </>
}
