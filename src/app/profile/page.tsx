"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, MapPin, Save, ArrowLeft, TrendingUp } from "lucide-react";

interface UserData {
  fullName: string;
  location: {
    state: string;
    city: string;
    coordinates?: { lat: number; lng: number };
    country: string;
  };
  initialInvestmentAmount: number;
  savingsThreshold: {
    type: "percentage" | "fixed";
    value: number;
  };
  annualSavingsInterestRate: number;
}

interface PortfolioData {
  unallocatedAmount: number;
  totalAllocated: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(
    null,
  );
  const [formData, setFormData] = useState<UserData>({
    fullName: "",
    location: {
      state: "",
      city: "",
      country: "India",
    },
    initialInvestmentAmount: 0,
    savingsThreshold: {
      type: "percentage",
      value: 0,
    },
    annualSavingsInterestRate: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session?.user?.id) {
      setUserId(session.user.id);
      fetchUserData(session.user.id);
      fetchPortfolioData(session.user.id);
    }
  }, [session, status, router]);

  const fetchUserData = async (uid: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/profile/${uid}`);
      const data = await response.json();

      if (data.success) {
        setUserData(data.data);
        setFormData(data.data);
      } else {
        setErrors({ fetch: data.message || "Failed to load profile" });
      }
    } catch (error) {
      setErrors({ fetch: "An error occurred while loading profile" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioData = async (uid: string) => {
    try {
      const response = await fetch(`/api/portfolio/${uid}`);
      const data = await response.json();

      if (data.success && data.data.portfolio) {
        const allocations = data.data.portfolio.allocations || {};
        const totalAllocated =
          Object.values(allocations).reduce(
            (sum: number, val: any) => sum + Number(val),
            0,
          ) +
          (data.data.portfolio.goldAllocation || 0) +
          (data.data.portfolio.savingsAllocation || 0);

        setPortfolioData({
          unallocatedAmount: data.data.portfolio.unallocatedAmount || 0,
          totalAllocated,
        });
      }
    } catch (error) {
      console.error("Failed to fetch portfolio data:", error);
    }
  };

  const detectLocation = async () => {
    setDetectingLocation(true);
    setErrors({});

    if (!navigator.geolocation) {
      setErrors({ location: "Geolocation is not supported by your browser" });
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();

          if (data.address) {
            setFormData((prev) => ({
              ...prev,
              location: {
                ...prev.location,
                state: data.address.state || "",
                city: data.address.city || data.address.town || "",
                coordinates: {
                  lat: latitude,
                  lng: longitude,
                },
              },
            }));
          }
        } catch (error) {
          setErrors({ location: "Failed to detect location" });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setErrors({ location: "Failed to get your location" });
        setDetectingLocation(false);
      },
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Name is required";
    }

    if (!formData.location.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.location.city.trim()) {
      newErrors.city = "City is required";
    }

    if (formData.initialInvestmentAmount < 1000) {
      newErrors.initialInvestmentAmount =
        "Minimum investment is ₹1,000";
    }

    if (formData.savingsThreshold.value <= 0) {
      newErrors.savingsThreshold = "Savings threshold must be greater than 0";
    }

    if (formData.annualSavingsInterestRate < 0 || formData.annualSavingsInterestRate > 100) {
      newErrors.annualSavingsInterestRate = "Interest rate must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const response = await fetch(`/api/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Profile updated successfully!");
        setUserData(formData);
        await fetchPortfolioData(userId);
      } else {
        setErrors({ submit: data.message || "Failed to update profile" });
      }
    } catch (error) {
      setErrors({ submit: "An error occurred while updating profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number,
    nested?: string,
  ) => {
    if (nested) {
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...(prev[field as keyof UserData] as any),
          [nested]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (errors.fetch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{errors.fetch}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const safeSavings =
    formData.savingsThreshold.type === "percentage"
      ? (formData.initialInvestmentAmount * formData.savingsThreshold.value) /
        100
      : formData.savingsThreshold.value;

  const maxInvestmentReduction = portfolioData?.unallocatedAmount || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your personal and investment information
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {portfolioData && portfolioData.totalAllocated > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-semibold text-blue-900">
              Investment Change Constraints
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              You have ₹{portfolioData.totalAllocated.toLocaleString("en-IN")}{" "}
              already allocated in your portfolio. You can reduce your total
              investment by up to ₹
              {maxInvestmentReduction.toLocaleString("en-IN")} (unallocated
              amount).
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your basic profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className={errors.fullName ? "border-red-500" : ""}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Location</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={detectLocation}
                    disabled={detectingLocation}
                  >
                    {detectingLocation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Detect Location
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="e.g., Maharashtra"
                      value={formData.location.state}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value, "state")
                      }
                      className={errors.state ? "border-red-500" : ""}
                    />
                    {errors.state && (
                      <p className="text-sm text-red-600">{errors.state}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="e.g., Mumbai"
                      value={formData.location.city}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value, "city")
                      }
                      className={errors.city ? "border-red-500" : ""}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>
                </div>

                {errors.location && (
                  <p className="text-sm text-red-600">{errors.location}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Investment Settings</CardTitle>
              <CardDescription>
                Configure your investment and savings preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="initialInvestmentAmount">
                  Total Investment Amount (₹)
                </Label>
                <Input
                  id="initialInvestmentAmount"
                  type="number"
                  placeholder="Enter amount in rupees"
                  value={formData.initialInvestmentAmount}
                  onChange={(e) =>
                    handleInputChange(
                      "initialInvestmentAmount",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className={
                    errors.initialInvestmentAmount ? "border-red-500" : ""
                  }
                />
                {errors.initialInvestmentAmount && (
                  <p className="text-sm text-red-600">
                    {errors.initialInvestmentAmount}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimum investment: ₹1,000
                </p>
              </div>

              <div className="space-y-4">
                <Label>Savings Threshold</Label>
                <RadioGroup
                  value={formData.savingsThreshold.type}
                  onValueChange={(value: "percentage" | "fixed") =>
                    handleInputChange("savingsThreshold", value, "type")
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="font-normal">
                      Percentage of investment
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="font-normal">
                      Fixed amount
                    </Label>
                  </div>
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor="savingsValue">
                    {formData.savingsThreshold.type === "percentage"
                      ? "Percentage (%)"
                      : "Amount (₹)"}
                  </Label>
                  <Input
                    id="savingsValue"
                    type="number"
                    placeholder={
                      formData.savingsThreshold.type === "percentage"
                        ? "e.g., 20"
                        : "e.g., 20000"
                    }
                    value={formData.savingsThreshold.value}
                    onChange={(e) =>
                      handleInputChange(
                        "savingsThreshold",
                        parseFloat(e.target.value) || 0,
                        "value",
                      )
                    }
                    className={errors.savingsThreshold ? "border-red-500" : ""}
                  />
                  {errors.savingsThreshold && (
                    <p className="text-sm text-red-600">
                      {errors.savingsThreshold}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Safe savings amount: ₹{safeSavings.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualSavingsInterestRate">
                  Annual Savings Interest Rate (%)
                </Label>
                <Input
                  id="annualSavingsInterestRate"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 6.5"
                  value={formData.annualSavingsInterestRate}
                  onChange={(e) =>
                    handleInputChange(
                      "annualSavingsInterestRate",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className={
                    errors.annualSavingsInterestRate ? "border-red-500" : ""
                  }
                />
                {errors.annualSavingsInterestRate && (
                  <p className="text-sm text-red-600">
                    {errors.annualSavingsInterestRate}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Expected interest rate on your savings account
                </p>
              </div>
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
