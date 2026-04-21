"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateUser, useUser } from "@/hooks/use-user";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const PROFILE_IMAGES_BUCKET =
	process.env.NEXT_PUBLIC_SUPABASE_PROFILE_IMAGES_BUCKET?.trim() || "venue-images";

const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function splitDisplayName(displayName: string | null | undefined): {
	first_name: string;
	last_name: string;
} {
	const normalized = (displayName ?? "").trim();
	if (!normalized) {
		return { first_name: "", last_name: "" };
	}

	const parts = normalized.split(/\s+/).filter(Boolean);
	if (parts.length === 1) {
		return { first_name: parts[0], last_name: "" };
	}

	return {
		first_name: parts[0],
		last_name: parts.slice(1).join(" "),
	};
}

function buildInitials(name: string): string {
	const initials = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");

	return initials || "U";
}

const profileFormSchema = z.object({
	first_name: z
		.string()
		.min(2, {
			message: "Name must be at least 2 characters.",
		})
		.max(100, {
			message: "Name must not be longer than 100 characters.",
		}),
	last_name: z
		.string()
		.min(2, {
			message: "Name must be at least 2 characters.",
		})
		.max(100, {
			message: "Name must not be longer than 100 characters.",
		}),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultValues: Partial<ProfileFormValues> = {
	first_name: "",
	last_name: "",
};

export default function ProfileForm() {
	const supabase = getSupabaseBrowserClient();
	const fileInputRef = React.useRef<HTMLInputElement | null>(null);
	const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
	const [photoPreviewUrl, setPhotoPreviewUrl] = React.useState<string | null>(null);

	const { data: userData } = useUser();
	const { mutateAsync: updateUser, isPending: isUpdatingUser } = useUpdateUser();

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileFormSchema),
		defaultValues,
		mode: "onChange",
	});
	const watchedFirstName = form.watch("first_name");
	const watchedLastName = form.watch("last_name");

	React.useEffect(() => {
		const names = splitDisplayName(userData?.displayName);
		form.reset(names);
	}, [userData?.displayName, form]);

	const avatarName = React.useMemo(() => {
		const first = watchedFirstName?.trim() ?? "";
		const last = watchedLastName?.trim() ?? "";
		const combined = `${first} ${last}`.trim();
		return combined || userData?.displayName?.trim() || "User";
	}, [watchedFirstName, watchedLastName, userData?.displayName]);

	const avatarUrl = photoPreviewUrl ?? userData?.photoUrl ?? undefined;

	const uploadProfilePhoto = React.useCallback(
		async (file: File): Promise<string> => {
			if (!userData?.user?.id) {
				throw new Error("You need to be logged in to upload a profile picture.");
			}

			if (!file.type.startsWith("image/")) {
				throw new Error("Please upload a valid image file.");
			}

			if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
				throw new Error("Image size must be 5 MB or less.");
			}

			const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
			const filePath = `profiles/${userData.user.id}/avatar-${Date.now()}.${extension}`;

			const { error: uploadError } = await supabase.storage
				.from(PROFILE_IMAGES_BUCKET)
				.upload(filePath, file, {
					cacheControl: "3600",
					upsert: true,
				});

			if (uploadError) {
				throw new Error(uploadError.message);
			}

			const {
				data: { publicUrl },
			} = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(filePath);

			if (!publicUrl) {
				throw new Error("Failed to generate profile image URL.");
			}

			return publicUrl;
		},
		[supabase, userData?.user?.id]
	);

	const handlePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsUploadingPhoto(true);
		try {
			const publicUrl = await uploadProfilePhoto(file);
			await updateUser({ photoUrl: publicUrl });
			setPhotoPreviewUrl(publicUrl);
			toast.success("Profile picture updated.");
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to update profile picture.";
			toast.error(message);
		} finally {
			event.target.value = "";
			setIsUploadingPhoto(false);
		}
	};

	const isBusy = isUpdatingUser || isUploadingPhoto;

	async function onSubmit(data: ProfileFormValues) {
		const displayName = `${data.first_name} ${data.last_name}`.replace(/\s+/g, " ").trim();

		try {
			await updateUser({ displayName });
			toast.success("Profile updated successfully!", {
				description: "Your profile has been updated.",
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to update profile.";
			toast.error(message);
		}
	}

	return (
		<div className="space-y-6">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<div className="flex items-center gap-6">
						<Avatar className="h-20 w-20">
							<AvatarImage src={avatarUrl} alt={avatarName} />
							<AvatarFallback>{buildInitials(avatarName)}</AvatarFallback>
						</Avatar>
						<div className="space-y-2">
							<Label htmlFor="picture">Profile Picture</Label>
							<input
								id="picture"
								type="file"
								accept="image/*"
								className="hidden"
								ref={fileInputRef}
								onChange={handlePictureChange}
							/>
							<Button
								variant="outline"
								size="sm"
								className="w-fit"
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={isBusy}
							>
								<Camera className="mr-2 h-4 w-4" />
								{isUploadingPhoto ? "Uploading..." : "Change Picture"}
							</Button>
						</div>
					</div>
					<div className="grid gap-6 md:grid-cols-2">
						<FormField
							control={form.control}
							name="first_name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>First Name</FormLabel>
									<FormControl>
										<Input placeholder="First Name" {...field} disabled={isBusy} />
									</FormControl>

									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="last_name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Last Name</FormLabel>
									<FormControl>
										<Input placeholder="Last Name" {...field} disabled={isBusy} />
									</FormControl>

									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Button type="submit" disabled={isBusy}>
						{isUpdatingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
						Update profile
					</Button>
				</form>
			</Form>
		</div>
	);
}