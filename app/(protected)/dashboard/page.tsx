"use client"
import { Button } from "@/components/ui/button";
import { useUpdateUser, useUser } from "@/hooks/use-user";
import { toast } from "sonner";

export default function DashboardPage() {
  const {data: user , isLoading} = useUser();
  const currentAccountType = user?.userType;

  const { mutateAsync: updateUser } = useUpdateUser();

  const handleUpdateAccountType = async (accountType: 'venue_owner' | 'rentee') => {
    if (accountType === currentAccountType) return;
   
    
    try {
      const response = await updateUser({ accountType });
      console.log("🚀 ~ handleUpdateAccountType ~ response:", response)
      if (response?.data?.account_type === accountType) {
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
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm mb-4">
      <div className="flex flex-col space-y-1.5 p-4 pb-2">
        <h3 className="text-lg font-semibold">Account Type</h3>
      </div>
      <div className="p-4 pt-0">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Current: <span className="font-medium text-foreground">{currentAccountType}</span>
          </p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={currentAccountType === 'venue_owner' ? 'default' : 'outline'}
              onClick={() => void handleUpdateAccountType('venue_owner')}
              disabled={isLoading || currentAccountType === 'venue_owner'}
            >
              Venue Owner
            </Button>
            
            <Button
              size="sm"
              variant={currentAccountType === 'rentee' ? 'default' : 'outline'}
              onClick={() => void handleUpdateAccountType('rentee')}
              disabled={isLoading || currentAccountType === 'rentee'}
            >
              Rentee
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
