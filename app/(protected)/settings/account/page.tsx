"use client"
import { Button } from "@/components/ui/button";
import { useUpdateUser, useUser } from "@/hooks/use-user";
import { Loader } from "lucide-react";
import { toast } from "sonner";

export default function AccountSettingsPage() {
  const {data: user , isLoading } = useUser();
  const currentAccountType = user?.userType;

  const { mutateAsync: updateUser , isPending } = useUpdateUser();

  const handleUpdateAccountType = async (accountType: 'venue_owner' | 'rentee') => {
    if (accountType === currentAccountType) return;
   
    
    try {
      const response = await updateUser({ accountType: accountType });
      const updatedAccountType = response?.account_type ?? response?.data?.account_type;
      if (updatedAccountType === accountType) {
        toast.success(`Account type updated to ${accountType}`);
      } else {
        toast.error('Failed to update account type, please try again.');
      }
      
      
    } catch (error) {
      console.error('Failed to update account type:', error);
      toast.error('Failed to update account type, please try again.');
    } finally {
      
    }
  };
  

  return (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Current account type</p>
          <p className="text-sm font-medium text-foreground capitalize">
            {currentAccountType === "venue_owner" ? "Venue Owner" : "Rentee"}
          </p>
        </div>
  
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            variant={currentAccountType === "venue_owner" ? "default" : "outline"}
            onClick={() => void handleUpdateAccountType("venue_owner")}
            disabled={isLoading || currentAccountType === "venue_owner" || isPending}
          >
            Venue Owner {isPending&&currentAccountType !== "venue_owner" &&<Loader className="animate-spin"/>}
          </Button>
  
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            variant={currentAccountType === "rentee" ? "default" : "outline"}
            onClick={() => void handleUpdateAccountType("rentee")}
            disabled={isLoading || currentAccountType === "rentee" || isPending}
          >
            Rentee {isPending&&currentAccountType !== "rentee" &&<Loader className="animate-spin"/>}
          </Button>
        </div>
      </div>
  )
}
