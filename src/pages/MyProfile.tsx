import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile, useUpdateMyProfile } from "@/hooks/useStaff";
import { ROLE_LABELS } from "@/lib/staffStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const MyProfile = () => {
  const { staff: authStaff } = useAuth();
  const { data: profile, isLoading } = useMyProfile();
  const { mutate: updateProfile, isPending } = useUpdateMyProfile();

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editing, setEditing] = useState(false);
  const [pwSection, setPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const startEdit = () => {
    setEditName(profile?.name ?? "");
    setEditEmail(profile?.email ?? "");
    setEditing(true);
  };

  const saveProfile = () => {
    updateProfile(
      { name: editName, email: editEmail },
      {
        onSuccess: () => { toast.success("Profile updated"); setEditing(false); },
        onError: (e: any) => toast.error(e.message),
      }
    );
  };

  const changePassword = () => {
    if (!currentPw || !newPw) return toast.error("Fill all password fields");
    if (newPw !== confirmPw) return toast.error("New passwords do not match");
    updateProfile(
      { currentPassword: currentPw, newPassword: newPw },
      {
        onSuccess: () => {
          toast.success("Password changed");
          setPwSection(false);
          setCurrentPw(""); setNewPw(""); setConfirmPw("");
        },
        onError: (e: any) => toast.error(e.message),
      }
    );
  };

  const display = profile ?? authStaff;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">Your account details</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
        {/* Avatar + role */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {display?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">{display?.name}</h2>
            <p className="text-sm text-muted-foreground">{display?.email}</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {authStaff?.role ? ROLE_LABELS[authStaff.role] : ""}
            </span>
          </div>
        </div>

        {/* Edit name/email */}
        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEdit} disabled={isLoading}>
            Edit Name / Email
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1">Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1">Email</Label>
              <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email" className="h-9 text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveProfile} disabled={isPending}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Change password */}
        <div className="border-t border-border pt-4">
          {!pwSection ? (
            <Button variant="outline" size="sm" onClick={() => setPwSection(true)}>
              Change Password
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">Change Password</p>
              <div>
                <Label className="text-xs mb-1">Current Password</Label>
                <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1">New Password</Label>
                <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1">Confirm New Password</Label>
                <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={changePassword} disabled={isPending}>Update Password</Button>
                <Button size="sm" variant="outline" onClick={() => { setPwSection(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
