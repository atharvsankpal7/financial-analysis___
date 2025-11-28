"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
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
    fetchUserData();
    fetchPortfolioData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/profile/${userId}`);
      const data = await response.json();

      if (data.success) {
        setUserData(data.data);
        setFormData(data.data);
      } else {
        setErrors({ fetch: data.message || "Failed to load user data" });
      }
    } catch (error) {
      setErrors({ fetch: "An error occurred while loading user data" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch(`/api/portfolio/${userId}`);
      const data = await response.json();

      if (data.success) {
        const allocations = data.data.portfolio.allocations as Record<
          string,
          number
        >;
        const totalAllocated =
          data.data.portfolio.savingsAllocation +
          data.data.portfolio.goldAllocation +
          Object.values(allocations).reduce(
            (sum: number, val: number) => sum + val,
            0,
          );

        setPortfolioData({
          unallocatedAmount: data.data.portfolio.unallocatedAmount || 0,
          totalAllocated,
        });
      }
    } catch (error) {
      console.error("Failed to fetch portfolio data");
    }
  };

  const detectLocation = async () => {
    setDetectingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            );
            const data = await response.json();

            setFormData((prev) => ({
              ...prev,
              location: {
                state: data.address.state || "",
                city:
                  data.address.city ||
                  data.address.town ||
                  data.address.village ||
                  "",
                coordinates: { lat: latitude, lng: longitude },
                country: "India",
              },
            }));
          } catch (error) {
            console.error("Failed to fetch location details");
          }
          setDetectingLocation(false);
        },
        () => {
          setDetectingLocation(false);
        },
      );
    } else {
      setDetectingLocation(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName || formData.fullName.length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    if (!formData.location.state) {
      newErrors.state = "State is required";
    }

    if (!formData.location.city) {
      newErrors.city = "City is required";
    }

    const investment = formData.initialInvestmentAmount;
    if (!investment || investment < 1000) {
      newErrors.initialInvestmentAmount = "Minimum investment is ₹1,000";
    }

    if (portfolioData && userData) {
      const currentInvestment = userData.initialInvestmentAmount;
      const reduction = currentInvestment - investment;

      if (reduction > 0 && reduction > portfolioData.unallocatedAmount) {
        newErrors.initialInvestmentAmount = `Cannot reduce investment by ${formatCurrency(reduction)}. Only ${formatCurrency(portfolioData.unallocatedAmount)} is unallocated. Please adjust your portfolio first.`;
      }
    }

    const thresholdValue = formData.savingsThreshold.value;
    if (!thresholdValue || thresholdValue < 0) {
      newErrors.savingsThreshold = "Savings threshold must be positive";
    }

    const interestRate = formData.annualSavingsInterestRate;
    if (interestRate < 0 || interestRate > 100) {
      newErrors.annualSavingsInterestRate =
        "Interest rate must be between 0 and 100";
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

    try {
      const response = await fetch(`/api/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/dashboard/${userId}`);
      } else {
        setErrors({ submit: data.message || "Failed to update profile" });
      }
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
          <p className="text-gray-600">Loading profile...</p>
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-gray-600 mt-1">
              Update your account information
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/stocks/${userId}`)}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Manage Stocks
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/${userId}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {portfolioData && portfolioData.unallocatedAmount > 0 && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-orange-900">
                  Unallocated Amount
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  You have {formatCurrency(portfolioData.unallocatedAmount)} not
                  allocated in your portfolio. You can reduce your investment by
                  this amount or allocate it in the adjustment dialog.
                </p>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {formatCurrency(portfolioData.unallocatedAmount)}
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Manage your profile and investment preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500">{errors.fullName}</p>
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
                      value={formData.location.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          location: {
                            ...formData.location,
                            state: e.target.value,
                          },
                        })
                      }
                      placeholder="Enter state"
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500">{errors.state}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.location.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          location: {
                            ...formData.location,
                            city: e.target.value,
                          },
                        })
                      }
                      placeholder="Enter city"
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialInvestmentAmount">
                  Initial Investment Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">
                    ₹
                  </span>
                  <Input
                    id="initialInvestmentAmount"
                    type="number"
                    className="pl-8"
                    value={formData.initialInvestmentAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        initialInvestmentAmount:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="100000"
                  />
                </div>
                {errors.initialInvestmentAmount && (
                  <p className="text-sm text-red-500">
                    {errors.initialInvestmentAmount}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Label>Savings Threshold</Label>
                <RadioGroup
                  value={formData.savingsThreshold.type}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setFormData({
                      ...formData,
                      savingsThreshold: {
                        ...formData.savingsThreshold,
                        type: value,
                      },
                    })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage">Percentage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed">Fixed Amount</Label>
                  </div>
                </RadioGroup>

                <div className="relative">
                  {formData.savingsThreshold.type === "fixed" && (
                    <span className="absolute left-3 top-2.5 text-gray-500">
                      ₹
                    </span>
                  )}
                  <Input
                    type="number"
                    className={
                      formData.savingsThreshold.type === "fixed" ? "pl-8" : ""
                    }
                    value={formData.savingsThreshold.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        savingsThreshold: {
                          ...formData.savingsThreshold,
                          value: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    placeholder={
                      formData.savingsThreshold.type === "percentage"
                        ? "20"
                        : "50000"
                    }
                  />
                  {formData.savingsThreshold.type === "percentage" && (
                    <span className="absolute right-3 top-2.5 text-gray-500">
                      %
                    </span>
                  )}
                </div>
                {errors.savingsThreshold && (
                  <p className="text-sm text-red-500">
                    {errors.savingsThreshold}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualSavingsInterestRate">
                  Annual Savings Interest Rate
                </Label>
                <div className="relative">
                  <Input
                    id="annualSavingsInterestRate"
                    type="number"
                    step="0.1"
                    value={formData.annualSavingsInterestRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        annualSavingsInterestRate:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="6.5"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500">
                    %
                  </span>
                </div>
                {errors.annualSavingsInterestRate && (
                  <p className="text-sm text-red-500">
                    {errors.annualSavingsInterestRate}
                  </p>
                )}
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
