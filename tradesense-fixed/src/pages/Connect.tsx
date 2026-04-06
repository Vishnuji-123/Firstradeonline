import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Connect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/import", { replace: true });
  }, [navigate]);
  return null;
}
