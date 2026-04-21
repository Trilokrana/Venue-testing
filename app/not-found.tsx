import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";
import Link from "next/link";

import { DashboardLayout } from "@/layout/DashboardLayout";

export default function NotFound() {
	return (
		<DashboardLayout>
<div className="flex items-center justify-center">
			<Card className="w-full max-w-md text-center">
				<CardHeader>
					<div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
						<AlertTriangle className="h-12 w-12 text-red-500" />
					</div>
					<CardTitle className="text-2xl">Page Not Found</CardTitle>
					<CardDescription>Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="text-sm text-muted-foreground">
						<p>Error 404</p>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
						
								<Button  asChild>
									<Link href="/dashboard">
										<Home className="mr-2 h-4 w-4" />
										Go Home
									</Link>
								</Button>
							
					</div>
				</CardContent>
			</Card>
		</div>
        </DashboardLayout>
	);
}