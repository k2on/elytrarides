import View from "@/components/View";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

const billing = () => {
    return <View className="max-w-3xl mx-auto py-8">
        <Card>
            <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>Manage all your organization subscription plan.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Demo Period</AlertTitle>
                  <AlertDescription>
                    Billing not avaliable during a demo period.
                  </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    </View>
}

export default billing;
