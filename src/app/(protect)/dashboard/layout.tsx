
import { ReactNode } from "react";
import { Toaster } from "sonner";
const DashboardLayout = async ({children}:{children: ReactNode}) => {

    return (  
        <>
        {children}
        <Toaster position="top-right" />
        </>
    );
}
 
export default DashboardLayout;