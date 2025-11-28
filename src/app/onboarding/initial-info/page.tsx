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
import { Progress } from "@/components/ui/progress";
import { MapPin, Loader2 } from "lucide-react";

export default function InitialInfoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    location: {
      state: "",
      city: "",
      coordinates: { lat: 0, lng: 0 },
      country: "India",
    },
    initialInvestmentAmount: "",
    savingsThreshold: {
      type: "percentage" as "percentage" | "fixed",
      value: "",
    },
    annualSavingsInterestRate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    detectLocation();
  }, [status, router]);

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

    const investment = parseFloat(formData.initialInvestmentAmount);
    if (!formData.initialInvestmentAmount || investment < 1000) {
      newErrors.initialInvestmentAmount = "Minimum investment is ₹1,000";
    }

    const thresholdValue = parseFloat(formData.savingsThreshold.value);
    if (!formData.savingsThreshold.value || thresholdValue < 0) {
      newErrors.savingsThreshold = "Savings threshold must be positive";
    }

    const interestRate = parseFloat(formData.annualSavingsInterestRate);
    if (
      !formData.annualSavingsInterestRate ||
      interestRate < 0 ||
      interestRate > 100
    ) {
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

    setLoading(true);

    try {
      const response = await fetch("/api/onboarding/initial-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          location: formData.location,
          initialInvestmentAmount: parseFloat(formData.initialInvestmentAmount),
          savingsThreshold: {
            type: formData.savingsThreshold.type,
            value: parseFloat(formData.savingsThreshold.value),
          },
          annualSavingsInterestRate: parseFloat(
            formData.annualSavingsInterestRate,
          ),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store userId in localStorage for use across the app
        if (data.data?.userId) {
          localStorage.setItem("userId", data.data.userId);
        }
        router.push("/onboarding/select-stocks");
      } else {
        setErrors({ submit: data.message || "Failed to save profile" });
      }
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Progress value={50} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">Step 1 of 2</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Initial Information</CardTitle>
            <CardDescription>
              Let's start by gathering some basic information about your
              investment goals
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
                        initialInvestmentAmount: e.target.value,
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
                          value: e.target.value,
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
                        annualSavingsInterestRate: e.target.value,
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
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Continue"
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
