"use client";

import { UserData } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import EditProfileDialog from "./edit-profile-dialog";

// ################################################################################################

interface EditProfileButtonProps {
  user: UserData;
}

export default function EditProfileButton({ user }: EditProfileButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        Edit Profile
      </Button>
      <EditProfileDialog
        user={user}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}
