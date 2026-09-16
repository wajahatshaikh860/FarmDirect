import Button from "@/components/ui/Button";
import { ArrowUpRight } from "lucide-react";
export default function ProfileTip() {
  return (
    <div className="dashboard-tip">
      <div>
        <strong>Let’s get to know you</strong>
        <p>View the details of your FarmDirect account.</p>
      </div>
      <Button href="/profile" variant="secondary" className="small">
        View Profile <ArrowUpRight size={16} />
      </Button>
    </div>
  );
}
